const errorHandler = (err, req, res, next) => {
  console.error(err);
  if (err?.code === 11000) {
    const fields = Object.keys(err.keyPattern || {}).join(', ');
    return res.status(400).json({
      message: fields ? `Duplicate value for: ${fields}` : 'Duplicate value already exists'
    });
  }
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message || 'Server Error'
  });
};

module.exports = errorHandler;
