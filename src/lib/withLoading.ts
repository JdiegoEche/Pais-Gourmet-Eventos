// Deshabilita el botón y le cambia el texto mientras dura la promesa, para que quede claro
// que está laburando (si no, con el fetch tardando unos segundos parece que no pasó nada).
// El "finally" garantiza que el botón se restaure pase lo que pase adentro — éxito, error
// manejado, o una excepción que nadie previó — sin depender de que cada rama se acuerde de
// hacerlo a mano.
export async function withLoading<T>(
  button: HTMLButtonElement,
  loadingText: string,
  task: () => Promise<T>
): Promise<T> {
  const originalText = button.textContent;
  button.disabled = true;
  button.dataset.loading = 'true';
  button.textContent = loadingText;
  try {
    return await task();
  } finally {
    button.disabled = false;
    button.dataset.loading = 'false';
    button.textContent = originalText;
  }
}
