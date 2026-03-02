/**
 * Custom select component with WAI-ARIA listbox pattern.
 * Renders badge chips for life stage and food type.
 */

export function initCustomSelect(wrapper: HTMLElement, onChange: (value: string) => void): void {
  const trigger = wrapper.querySelector('[data-trigger]') as HTMLButtonElement | null;
  const listbox = wrapper.querySelector('[role="listbox"]') as HTMLElement | null;
  if (!trigger || !listbox) return;

  const options = () => Array.from(listbox.querySelectorAll('[role="option"]')) as HTMLElement[];

  function open(): void {
    trigger!.setAttribute('aria-expanded', 'true');
    listbox!.classList.remove('hidden');
    // Scroll selected option into view
    const selected = listbox!.querySelector('[aria-selected="true"]') as HTMLElement | null;
    if (selected) {
      setActive(selected);
      selected.scrollIntoView({ block: 'nearest' });
    }
  }

  function close(): void {
    trigger!.setAttribute('aria-expanded', 'false');
    listbox!.classList.add('hidden');
    clearActive();
  }

  function isOpen(): boolean {
    return trigger!.getAttribute('aria-expanded') === 'true';
  }

  function setActive(el: HTMLElement): void {
    clearActive();
    el.setAttribute('data-active', '');
    el.classList.add('bg-gray-100');
  }

  function clearActive(): void {
    for (const opt of options()) {
      opt.removeAttribute('data-active');
      opt.classList.remove('bg-gray-100');
    }
  }

  function selectOption(el: HTMLElement): void {
    const value = el.getAttribute('data-value') ?? '';
    // Update aria-selected
    for (const opt of options()) {
      opt.setAttribute('aria-selected', 'false');
    }
    el.setAttribute('aria-selected', 'true');
    // Update trigger content to match selected option
    trigger!.innerHTML = el.innerHTML;
    close();
    onChange(value);
  }

  function activeOption(): HTMLElement | null {
    return listbox!.querySelector('[data-active]');
  }

  function moveFocus(direction: 1 | -1): void {
    const opts = options();
    if (opts.length === 0) return;
    const current = activeOption();
    const idx = current ? opts.indexOf(current) : -1;
    let next = idx + direction;
    if (next < 0) next = 0;
    if (next >= opts.length) next = opts.length - 1;
    setActive(opts[next]);
    opts[next].scrollIntoView({ block: 'nearest' });
  }

  // Click trigger toggles
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isOpen()) {
      close();
    } else {
      open();
    }
  });

  // Click option selects
  listbox.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('[role="option"]') as HTMLElement | null;
    if (target) {
      selectOption(target);
    }
  });

  // Keyboard on trigger
  trigger.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen()) {
        open();
      } else {
        moveFocus(e.key === 'ArrowDown' ? 1 : -1);
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (isOpen()) {
        const active = activeOption();
        if (active) selectOption(active);
        else close();
      } else {
        open();
      }
    } else if (e.key === 'Escape') {
      if (isOpen()) {
        e.preventDefault();
        close();
        trigger.focus();
      }
    }
  });

  // Keyboard on listbox (for when focus moves into it)
  listbox.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      moveFocus(e.key === 'ArrowDown' ? 1 : -1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const active = activeOption();
      if (active) selectOption(active);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
      trigger.focus();
    }
  });

  // Click-outside closes
  document.addEventListener('pointerdown', (e) => {
    if (isOpen() && !wrapper.contains(e.target as Node)) {
      close();
    }
  });
}
