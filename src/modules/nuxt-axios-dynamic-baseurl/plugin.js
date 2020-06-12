export default context => {
  if (process.client) {
    context.$axios.defaults.baseURL = window.location.origin
  }
}
