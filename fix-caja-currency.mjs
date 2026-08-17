import fs from 'node:fs';

const path = 'modules/caja/frontend/pages/caja.page.test.tsx';
let content = fs.readFileSync(path, 'utf-8');

function replaceOrThrow(oldStr, newStr) {
  if (!content.includes(oldStr)) {
    throw new Error(`Pattern not found: ${oldStr}`);
  }
  content = content.split(oldStr).join(newStr);
}

replaceOrThrow(
  "expect(screen.getByText('$80.00')).toBeInTheDocument();",
  "expect(screen.getByText('80,00 US$')).toBeInTheDocument();",
);
replaceOrThrow(
  "expect(screen.getByText(/Esperado: \$160\.00/)).toBeInTheDocument();",
  "expect(screen.getByText(/Esperado: 160,00 US\$/)).toBeInTheDocument();",
);
replaceOrThrow(
  "expect(screen.getByText(/Contado: \$150\.00/)).toBeInTheDocument();",
  "expect(screen.getByText(/Contado: 150,00 US\$/)).toBeInTheDocument();",
);
replaceOrThrow(
  "expect(screen.getByText(/Diferencia: -\$10\.00/)).toBeInTheDocument();",
  "expect(screen.getByText(/Diferencia: -10,00 US\$/)).toBeInTheDocument();",
);

fs.writeFileSync(path, content);
console.log('fixed', path);
