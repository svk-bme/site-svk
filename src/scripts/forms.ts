// Browser side of the forms: conditional fields, client checks, submitting to service-forms,
// showing field errors from the service, and pre-filling the application form from a personal link.
// The request and response formats are described in FORMS.md.

const startedAt = Date.now()

type Control = HTMLInputElement | HTMLTextAreaElement

function controls(form: HTMLFormElement, name: string): Control[] {
  return [...form.querySelectorAll<Control>(`[name="${CSS.escape(name)}"]`)]
}

function fieldElement(form: HTMLFormElement, name: string) {
  return form.querySelector<HTMLElement>(`[data-field="${CSS.escape(name)}"]`)
}

function hasValue(form: HTMLFormElement, name: string): boolean {
  return controls(form, name).some((c) =>
    c instanceof HTMLInputElement && (c.type === 'checkbox' || c.type === 'radio')
      ? c.checked
      : c instanceof HTMLInputElement && c.type === 'file'
        ? (c.files?.length ?? 0) > 0
        : c.value.trim() !== '',
  )
}

/** Shows fields with data-show-if="field=value" and makes them required while shown. */
function updateConditions(form: HTMLFormElement) {
  form.querySelectorAll<HTMLElement>('[data-show-if]').forEach((el) => {
    const [name, value] = el.dataset.showIf!.split('=')
    const visible = controls(form, name).some((c) => (c as HTMLInputElement).checked && c.value === value)
    el.classList.toggle('is-visible', visible)
    el.querySelectorAll<Control>('input, textarea').forEach((c) => {
      c.required = visible
      if (!visible) c.value = ''
    })
  })
  form.querySelectorAll<Control>('[data-required-unless]').forEach((c) => {
    c.required = !hasValue(form, c.dataset.requiredUnless!)
  })
}

function setError(form: HTMLFormElement, name: string, message: string) {
  const field = fieldElement(form, name)
  const error = field?.querySelector<HTMLElement>('.field__error')
  if (error) error.textContent = message
  controls(form, name).forEach((c) => c.setAttribute('aria-invalid', message ? 'true' : 'false'))
}

function clearErrors(form: HTMLFormElement) {
  form.querySelectorAll<HTMLElement>('.field__error').forEach((e) => (e.textContent = ''))
  form.querySelectorAll('[aria-invalid]').forEach((e) => e.removeAttribute('aria-invalid'))
}

/** Browser validation plus file size; returns the first invalid field. */
function validate(form: HTMLFormElement): HTMLElement | undefined {
  let first: HTMLElement | undefined
  const seen = new Set<string>()
  form.querySelectorAll<Control>('[name]:not([name^="_"])').forEach((c) => {
    if (seen.has(c.name)) return
    seen.add(c.name)
    let message = ''
    const group = controls(form, c.name)
    const isMulti = group.length > 1 && group.every((g) => (g as HTMLInputElement).type === 'checkbox')
    const fieldset = fieldElement(form, c.name)
    if (isMulti && fieldset?.hasAttribute('data-required') && !hasValue(form, c.name)) {
      message = form.dataset.msgChooseOne!
    }
    for (const g of group) {
      if (!g.checkValidity()) {
        message = g.validationMessage
        break
      }
    }
    if (!message && c instanceof HTMLInputElement && c.type === 'file' && c.files?.[0]) {
      const maxMb = Number(c.dataset.maxSizeMb)
      if (maxMb && c.files[0].size > maxMb * 1024 * 1024) message = `> ${maxMb} MB`
    }
    if (message) {
      setError(form, c.name, message)
      first ??= c
    }
  })
  return first
}

/** The submission: JSON, or multipart when the form has file inputs. */
function payload(form: HTMLFormElement): { body: BodyInit; headers: Record<string, string> } {
  const meta = {
    _lang: form.dataset.lang ?? '',
    _started: String(startedAt),
    _hp: (form.querySelector<HTMLInputElement>('[name="_hp"]')?.value ?? '').trim(),
    _token: new URLSearchParams(location.search).get('token') ?? '',
  }
  const hasFiles = form.querySelector('input[type="file"]') !== null
  if (hasFiles) {
    const data = new FormData(form)
    for (const [key, value] of Object.entries(meta)) data.set(key, value)
    return { body: data, headers: { Accept: 'application/json' } }
  }
  const values: Record<string, unknown> = { ...meta }
  const names = new Set([...form.querySelectorAll<Control>('[name]:not([name^="_"])')].map((c) => c.name))
  for (const name of names) {
    const group = controls(form, name)
    const first = group[0] as HTMLInputElement
    if (first.type === 'checkbox' && group.length === 1 && !fieldElement(form, name)?.matches('fieldset')) {
      values[name] = first.checked
    } else if (first.type === 'checkbox') {
      values[name] = group.filter((g) => (g as HTMLInputElement).checked).map((g) => g.value)
    } else if (first.type === 'radio') {
      values[name] = group.find((g) => (g as HTMLInputElement).checked)?.value ?? ''
    } else if (first.type === 'number') {
      values[name] = first.value === '' ? null : Number(first.value)
    } else {
      values[name] = first.value.trim()
    }
  }
  return {
    body: JSON.stringify(values),
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  }
}

function showStatus(form: HTMLFormElement, message: string, isError: boolean) {
  const status = form.querySelector<HTMLElement>('[data-form-status]')!
  status.classList.toggle('notice--error', isError)
  status.innerHTML = message
}

async function submit(form: HTMLFormElement, event: SubmitEvent) {
  event.preventDefault()
  clearErrors(form)
  updateConditions(form)
  const invalid = validate(form)
  if (invalid) {
    showStatus(form, form.dataset.msgFields!, true)
    invalid.focus()
    return
  }
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]')!
  const label = button.textContent
  button.disabled = true
  button.textContent = form.dataset.msgSending!
  showStatus(form, '', false)
  try {
    const { body, headers } = payload(form)
    const response = await fetch(form.dataset.endpoint!, { method: 'POST', body, headers })
    const result = (await response.json().catch(() => ({}))) as {
      message?: string
      errors?: Record<string, string>
    }
    if (response.ok) {
      const done = document.createElement('p')
      done.className = 'notice'
      done.setAttribute('role', 'status')
      done.textContent = form.dataset.msgSuccess!
      form.replaceWith(done)
      done.setAttribute('tabindex', '-1')
      done.focus()
      return
    }
    const errors = Object.entries(result.errors ?? {})
    errors.forEach(([name, message]) => setError(form, name, message))
    showStatus(form, errors.length ? form.dataset.msgFields! : result.message || form.dataset.msgError!, true)
    if (errors.length) controls(form, errors[0][0])[0]?.focus()
  } catch {
    showStatus(form, form.dataset.msgNetwork!, true)
  } finally {
    button.disabled = false
    button.textContent = label
  }
}

/** Fills the form with earlier answers when opened from a personal link (?token=…). */
async function prefill(form: HTMLFormElement) {
  const token = new URLSearchParams(location.search).get('token')
  if (!token || !form.dataset.prefill) return
  try {
    const response = await fetch(`${form.dataset.prefill}?token=${encodeURIComponent(token)}`, {
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) throw new Error(String(response.status))
    const { fields } = (await response.json()) as { fields: Record<string, unknown> }
    for (const [name, value] of Object.entries(fields ?? {})) {
      const values = (Array.isArray(value) ? value : [value]).map(String)
      for (const c of controls(form, name)) {
        if (c instanceof HTMLInputElement && (c.type === 'checkbox' || c.type === 'radio')) {
          c.checked = values.includes(c.value) || (value === true && c.value === 'true')
        } else if (!(c instanceof HTMLInputElement && c.type === 'file')) {
          c.value = values[0] ?? ''
        }
      }
    }
    updateConditions(form)
  } catch {
    showStatus(form, form.dataset.msgPrefill!, true)
  }
}

export function setupForm(form: HTMLFormElement) {
  form.addEventListener('change', () => updateConditions(form))
  form.addEventListener('submit', (e) => submit(form, e))
  updateConditions(form)
  void prefill(form)
}
