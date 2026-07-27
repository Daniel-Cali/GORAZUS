import { Asiento } from './asiento.entity';

describe('Asiento', () => {
  it('caso feliz: 2 líneas balanceadas', () => {
    expect(
      () =>
        new Asiento([
          { accountId: 'a-1', debitAmount: 100, creditAmount: 0 },
          { accountId: 'a-2', debitAmount: 0, creditAmount: 100 },
        ]),
    ).not.toThrow();
  });

  it('rechaza menos de 2 líneas', () => {
    expect(() => new Asiento([{ accountId: 'a-1', debitAmount: 100, creditAmount: 0 }])).toThrow(
      /al menos 2 líneas/,
    );
  });

  it('rechaza montos negativos', () => {
    expect(
      () =>
        new Asiento([
          { accountId: 'a-1', debitAmount: -1, creditAmount: 0 },
          { accountId: 'a-2', debitAmount: 0, creditAmount: 1 },
        ]),
    ).toThrow(/no pueden ser negativos/);
  });

  it('rechaza una línea con débito Y crédito a la vez', () => {
    expect(
      () =>
        new Asiento([
          { accountId: 'a-1', debitAmount: 50, creditAmount: 50 },
          { accountId: 'a-2', debitAmount: 0, creditAmount: 100 },
        ]),
    ).toThrow(/exactamente un lado/);
  });

  it('rechaza una línea sin ningún monto', () => {
    expect(
      () =>
        new Asiento([
          { accountId: 'a-1', debitAmount: 0, creditAmount: 0 },
          { accountId: 'a-2', debitAmount: 0, creditAmount: 100 },
        ]),
    ).toThrow(/exactamente un lado/);
  });

  it('rechaza un asiento desbalanceado', () => {
    expect(
      () =>
        new Asiento([
          { accountId: 'a-1', debitAmount: 100, creditAmount: 0 },
          { accountId: 'a-2', debitAmount: 0, creditAmount: 90 },
        ]),
    ).toThrow(/no está balanceado/);
  });

  it('acepta múltiples líneas por lado mientras el total balancee', () => {
    expect(
      () =>
        new Asiento([
          { accountId: 'a-1', debitAmount: 60, creditAmount: 0 },
          { accountId: 'a-2', debitAmount: 40, creditAmount: 0 },
          { accountId: 'a-3', debitAmount: 0, creditAmount: 100 },
        ]),
    ).not.toThrow();
  });

  it('tolera diferencias de redondeo por debajo de la tolerancia', () => {
    expect(
      () =>
        new Asiento([
          { accountId: 'a-1', debitAmount: 100.00001, creditAmount: 0 },
          { accountId: 'a-2', debitAmount: 0, creditAmount: 100 },
        ]),
    ).not.toThrow();
  });
});
