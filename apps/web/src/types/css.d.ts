// Allow importing plain CSS files (global styles)
declare module '*.css' {
  const content: string
  export default content
}
