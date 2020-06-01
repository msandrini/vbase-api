const ConnectionException = message => {
  this.message = message
  this.name = 'ConnectionException'
}

export const issueToClient = {
  send: (db, res, values) => {
    res.json(values)
    db.close()
  },
  fail: (db, res, error) => {
    if (typeof error === 'number') {
      res.sendStatus(error)
      if (db) db.close()
      throw new ConnectionException(error)
    } else {
      res.status(500).json(error)
      if (db) db.close()
      throw new ConnectionException(error)
    }
  }
}
