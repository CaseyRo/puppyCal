## 1. Update Network Switcher Markup

- [x] 1.1 Add logic to compare `config.outlet` with each `network.items[].id`
- [x] 1.2 Conditionally render `<span>` for current site, `<a>` for others
- [x] 1.3 Add `--current` modifier class to current site element

## 2. Add CSS Styling

- [x] 2.1 Add `.cdit-footer__network-link--current` styles (muted color, default cursor)
- [x] 2.2 Ensure no hover effects on current site element

## 3. Verification

- [x] 3.1 Test with outlet='cv' - CV link should be disabled
- [x] 3.2 Test with outlet='cdit' - CDIT link should be disabled
- [x] 3.3 Verify other links remain clickable
- [x] 3.4 Verify accessibility (not announced as link)
