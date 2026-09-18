export function responseData<T>(response: any, fallback: T): T {
	return (response?.data ?? response ?? fallback) as T;
}
