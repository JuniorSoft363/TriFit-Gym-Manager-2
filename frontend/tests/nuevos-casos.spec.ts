/**
 * Nuevos casos TC-INT-11..15 (equipo). Archivo separado de las suites
 * existentes. Un solo login API por corrida (ver ./sesion.ts).
 */
import test, { expect, Page } from "@playwright/test";
import { API, asegurarToken, authed, inyectarSesion, loginReal, refrescarSesion } from "./sesion";

const NUEVO = {
  cedula: '1978564321',
  nombres: 'Jorge Andrés',
  apellidos: 'Vera Cedeño',
  email: 'jvera@example.com',
  telefono: '0991234567'
};
const CEDULA_DUPLICADA = '1956789012';

async function irA(page: Page, ruta: string, titulo: string) {
  // domcontentloaded + aserción explícita: networkidle se cuelga con
  // recursos externos (fuentes) y no aporta a la verificación.
  await page.goto(`/app/${ruta}`, { waitUntil: 'domcontentloaded' });
  // exacto: evita choques como h1 'Asistencias' vs h2 'Asistencias de hoy'.
  // Timeout amplio por arranque en frío del backend (también en CI).
  await expect(page.getByRole('heading', { name: titulo, exact: true })).toBeVisible({
    timeout: 25000
  });
}

async function totalClientes(request: any, token: string) {
  const r = await authed(request, token).get(`${API}/clientes?limit=1`);
  return (await r.json()).total;
}

test.describe('Nuevos casos (TC-INT-11..15)', () => {
  test.beforeAll(async ({ request }) => {
    await loginReal(request);
    // Limpieza defensiva: si una corrida previa dejó al cliente, eliminarlo.
    const token = await asegurarToken(request);
    const r = authed(request, token);
    const existe = await r.get(`${API}/clientes/cedula/${NUEVO.cedula}`);
    if (existe.ok()) {
      const cli = await existe.json();
      await r.del(`${API}/clientes/${cli.id}?definitivo=true`);
    }
  });

  test.beforeEach(async ({ page, request }) => {
    await refrescarSesion(request);
    await inyectarSesion(page);
  });

  test('TC-INT-11 — Registrar un nuevo cliente con datos válidos', async ({ page, request }) => {
    await irA(page, 'clientes', 'Clientes');
    await page.getByRole('button', { name: 'Nuevo' }).click();

    const dlg = page.locator('mat-dialog-container');
    await dlg.getByLabel('Cédula', { exact: true }).fill(NUEVO.cedula);
    await dlg.getByLabel('Nombres', { exact: true }).fill(NUEVO.nombres);
    await dlg.getByLabel('Apellidos', { exact: true }).fill(NUEVO.apellidos);
    await dlg.getByLabel('Correo', { exact: true }).fill(NUEVO.email);
    await dlg.getByLabel('Teléfono', { exact: true }).fill(NUEVO.telefono);
    await dlg.getByRole('button', { name: 'Guardar' }).click();

    await expect(page.getByText(/Registro creado correctamente/i)).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: '../docs/evidencias/TC-INT-11/01-snackbar-registro.png' });
    await expect(page.getByText(NUEVO.cedula).first()).toBeVisible({ timeout: 10000 });

    // Queda disponible para asignar membresías (búsqueda por cédula).
    const token = await asegurarToken(request);
    const r = authed(request, token);
    const consulta = await r.get(`${API}/clientes/cedula/${NUEVO.cedula}`);
    expect(consulta.ok()).toBeTruthy();
    expect((await consulta.json()).nombres).toBe(NUEVO.nombres);

    // Limpieza: no dejar rastro para próximas corridas.
    const cli = await consulta.json();
    await r.del(`${API}/clientes/${cli.id}?definitivo=true`);
  });

  test('TC-INT-12 — Rechazar cliente con cédula duplicada', async ({ page, request }) => {
    const token = await asegurarToken(request);
    const r = authed(request, token);
    const antes = await totalClientes(request, token);

    await irA(page, 'clientes', 'Clientes');
    await page.getByRole('button', { name: 'Nuevo' }).click();

    const dlg = page.locator('mat-dialog-container');
    await dlg.getByLabel('Cédula', { exact: true }).fill(CEDULA_DUPLICADA);
    await dlg.getByLabel('Nombres', { exact: true }).fill('Otro Nombre');
    await dlg.getByLabel('Apellidos', { exact: true }).fill('Otro Apellido');
    await dlg.getByRole('button', { name: 'Guardar' }).click();

    // El backend informa el rechazo y no se crea nada.
    await expect(page.getByText(/Ya existe un registro con esos datos únicos/i)).toBeVisible({
      timeout: 10000
    });
    await page.screenshot({ path: '../docs/evidencias/TC-INT-12/01-snackbar-duplicado.png' });
    expect(await totalClientes(request, token)).toBe(antes);
  });

  test('TC-INT-13 — Registrar un pago asociado a una membresía activa', async ({
    page,
    request
  }) => {
    const token = await asegurarToken(request);
    const r = authed(request, token);
    const lista = await r.get(`${API}/membresias?estado=ACTIVA&limit=1`);
    test.skip(!lista.ok(), `No se pudo listar membresías: ${lista.status()}`);
    const activa = (await lista.json()).datos?.[0];
    test.skip(!activa, 'No hay membresías activas (ejecuta npm run seed:dataset)');

    await irA(page, 'pagos', 'Pagos');
    await page.getByRole('button', { name: 'Registrar pago' }).click();
    await expect(page.getByRole('heading', { name: 'Registrar pago' })).toBeVisible();

    const dlg = page.locator('mat-dialog-container');
    await dlg.getByLabel('Cédula del cliente').fill(activa.cliente.cedula);
    await dlg.getByRole('button', { name: 'Buscar' }).click();
    await expect(dlg.getByText(/Cliente:/)).toBeVisible({ timeout: 20000 });

    // El monto se autocompleta con el precio del plan.
    expect(Number(await dlg.getByLabel('Monto').inputValue())).toBe(Number(activa.plan.precio));

    await dlg.getByLabel('Método de pago').click();
    await page.getByRole('option', { name: 'Efectivo' }).click();
    await dlg.getByRole('button', { name: 'Registrar' }).click();

    await expect(page.getByText(/Pago registrado correctamente/i)).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: '../docs/evidencias/TC-INT-13/01-snackbar-pago.png' });
  });

  test('TC-INT-14 — Registrar el ingreso (check-in) de un socio con membresía activa', async ({
    page,
    request
  }) => {
    const token = await asegurarToken(request);
    const r = authed(request, token);
    const lista = await r.get(`${API}/membresias?estado=ACTIVA&limit=8`);
    test.skip(!lista.ok(), `No se pudo listar membresías: ${lista.status()}`);
    const activas = (await lista.json()).datos ?? [];
    test.skip(!activas.length, 'No hay membresías activas (ejecuta npm run seed:dataset)');

    // Elegir socio sin entrada abierta (cerrando la previa si quedó de otra corrida).
    let cedula = '';
    for (const m of activas) {
      const con = await r.get(`${API}/asistencias/consultar/${m.cliente.cedula}`);
      if (!con.ok()) continue;
      const estado = await con.json();
      if (!estado.membresia || estado.membresia.estado !== 'ACTIVA') continue;
      if (estado.entradaAbierta) {
        await r.post(`${API}/asistencias/salida`, { cedula: m.cliente.cedula });
      }
      cedula = m.cliente.cedula;
      break;
    }
    test.skip(!cedula, 'Sin socios con membresía activa disponibles');

    await irA(page, 'asistencias', 'Asistencias');
    await page.getByLabel('Cédula del cliente').fill(cedula);
    await page.getByRole('button', { name: 'Buscar' }).click();
    await page.getByRole('button', { name: 'Registrar entrada' }).click();
    await expect(page.getByText(/Entrada registrada/i)).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: '../docs/evidencias/TC-INT-14/01-snackbar-entrada.png' });

    // Segundo intento sin salida: rechazado.
    const dup = await r.post(`${API}/asistencias/entrada`, { cedula });
    expect(dup.status()).toBe(409);
    expect((await dup.json()).mensaje).toMatch(/ya registró una entrada sin salida/i);

    // Limpieza: cerrar la entrada.
    await r.post(`${API}/asistencias/salida`, { cedula });
  });

  test('TC-INT-15 — Rechazar salida de inventario que supera el stock', async ({
    page,
    request
  }) => {
    const token = await asegurarToken(request);
    const r = authed(request, token);
    const lista = await r.get(`${API}/inventario/productos?limit=25`);
    test.skip(!lista.ok(), `No se pudo listar productos: ${lista.status()}`);
    const datos = (await lista.json()).datos ?? [];
    const prod = datos.find((p: any) => Number(p.stock) >= 5);
    test.skip(!prod, 'Sin productos con stock >= 5 para la prueba');
    const stockAntes = Number(prod.stock);
    const cantidad = stockAntes + 5;

    await irA(page, 'inventario', 'Inventario');
    await page.getByRole('tab', { name: 'Movimientos' }).click();
    await page.getByRole('button', { name: 'Registrar movimiento' }).click();

    const dlg = page.locator('mat-dialog-container');
    await dlg.getByLabel('Producto / Equipo').click();
    await page.getByRole('option', { name: new RegExp(prod.nombre) }).click();
    await dlg.getByLabel('Tipo de movimiento').click();
    await page.getByRole('option', { name: 'Salida' }).click();
    await dlg.getByLabel('Cantidad').fill(String(cantidad));
    await dlg.getByRole('button', { name: 'Registrar' }).click();

    // El interceptor global muestra el 409 del backend.
    await expect(page.getByText(/Stock insuficiente/i)).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: '../docs/evidencias/TC-INT-15/01-snackbar-stock.png' });

    // El stock no se modificó.
    const verif = await r.get(`${API}/inventario/productos/${prod.id}`);
    expect(Number((await verif.json()).stock)).toBe(stockAntes);
  });
});
