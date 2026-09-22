function safeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    profile: user.profile || null,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

module.exports = { safeUser };
