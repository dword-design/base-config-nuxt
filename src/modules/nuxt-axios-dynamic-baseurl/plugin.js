export default ({ $axios }) => {
  if (process.client) {
    $axios.defaults.baseURL = window.location.origin
  }
}
