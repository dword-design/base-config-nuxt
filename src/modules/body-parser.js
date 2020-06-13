import bodyParser from 'body-parser'

export default function () {
  this.options.serverMiddleware.push(
    bodyParser.urlencoded({ extended: false }),
    bodyParser.json()
  )
}
