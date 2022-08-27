import express from 'express'

export default function () {
  this.options.serverMiddleware.push(express.json())
}
