import { parseAsString, useQueryStates } from "nuqs"

export function useView() {
	return useQueryStates({
		edit: parseAsString,
	})
}
