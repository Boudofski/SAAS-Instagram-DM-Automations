export function getAuthenticatedHomeRedirect(
  pathname: string,
  userId: string | null | undefined
) {
  return pathname === "/" && userId ? "/dashboard" : null;
}
