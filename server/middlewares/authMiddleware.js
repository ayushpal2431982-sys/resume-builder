import jwt from "jsonwebtoken";

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    // Extract token (remove "Bearer " prefix)
    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // FIXED: Changed from decoded.id to decoded.userId
    req.userId = decoded.userId; // ← THIS WAS THE BUG!
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({ message: "Not authorized" });
  }
};

export default protect;