export const isAdmin = (req, res, next) => {
  if (req.auth.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Admins only' });
  }
  next();
};

export const isOwnerOrAdmin = (model, idParam = 'id') => {
  return async (req, res, next) => {
    try {
      const resource = await model.findByPk(req.params[idParam]);

      if (!resource) {
        return res.status(404).json({ message: 'Resource wasnt found' });
      }

      if (
        resource.id !== req.auth.id &&
        resource.userId !== req.auth.id &&
        req.auth.role !== 'admin'
      ) {
        return res.status(403).json({ message: 'Not authorized.' });
      }

      req.resource = resource;
      next();
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  };
};
