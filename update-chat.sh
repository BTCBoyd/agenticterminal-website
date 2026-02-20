#!/bin/bash
# Update chat.html with terminal aesthetic
sed -i '
# Update colors
s/var(--dark-slate)/var(--bg-primary)/g
s/var(--mid-slate)/var(--bg-secondary)/g
s/var(--light-slate)/var(--bg-tertiary)/g

# Remove hero section large styling
/\.hero-section {/,/^        }$/ {
  s/padding: 3rem 2rem;/padding: 24px 2rem 16px;/
  s/background: linear-gradient([^)]*);/background: var(--bg-secondary);/
}

# Update value props
/\.value-prop {/,/^        }$/ {
  s/padding: 1\.5rem;/padding: 12px 16px;/
  s/font-size: 1\.1rem;/font-size: 14px;/
  s/font-size: 0\.95rem;/font-size: 13px;/
}
' chat.html
echo "Chat page updated"
