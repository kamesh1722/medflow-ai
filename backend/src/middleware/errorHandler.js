export function notFound(req, res) {
  res.status(404).json({ message: 'The requested API route was not found.' })
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error)
  if (error?.name === 'ValidationError' || error?.name === 'CastError') {
    return res.status(400).json({ message: 'The submitted medicine data is invalid.' })
  }
  if (error?.code === 11000) return res.status(409).json({ message: 'A record with those details already exists.' })
  console.error('API request failed:', error?.name || 'UnknownError')
  res.status(500).json({ message: 'An unexpected server error occurred.' })
}
