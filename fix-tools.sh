#!/bin/bash
# Make tools page compact grid layout
sed -i '
/\.tools-container {/,/^        }$/ {
  s/display: flex;/display: grid;/
  s/flex-direction: column;/grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));/
  s/gap: 2rem;/gap: 12px;/
}
' tools.html

sed -i '
/\.tool-card {/,/margin-bottom:/ {
  s/padding: 2rem;/padding: 14px 16px;/
  s/margin-bottom: 1\.5rem;/margin-bottom: 0;/
}
' tools.html

sed -i 's/font-size: 1\.8rem;/font-size: 14px;/g; s/font-size: 1\.3rem;/font-size: 14px;/g; s/font-size: 1\.1rem;/font-size: 13px;/g; s/font-size: 1rem;/font-size: 12px;/g' tools.html

echo "Tools page updated"
