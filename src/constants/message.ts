export const messages = {
  NOT_FOUND: {
    ec: 404,
    msg: 'API not found'
  },
  ACCESS_TOKEN_EXPIRED: {
    ec: 419,
    msg: 'Access token expired'
  },
  ACCESS_TOKEN_INVALID: {
    ec: 420,
    msg: 'Access token is invalid'
  },
  ACTIVE_TOKEN_EXPIRED: {
    ec: 421,
    msg: 'Access token has expired'
  },
  INTERNAL_SERVER_ERROR: {
    ec: 500,
    msg: 'Internal server error'
  },
  // user
  USER_REGISTERED_SUCCESS: {},
  USER_EXISTED: {
    // msg: 'User already exists',
    ec: 1000
  },
  USER_INVALID_ACTIVE_TOKEN: {
    msg: 'Invalid active token',
    ec: 1001
  },
  USER_NOT_FOUND: {
    ec: 1006
  },
  USER_INCORECT_EMAIL_PASSWORD: {
    ec: 1003
  },

  USER_ACTIVE_SUCCESS: {},
  USER_REQUEST_FORGET_PASSWORD_SUCCESS: {
    ec: 1005,
    messages: 'Request for reset password successful'
  },
  VERIFY_RESET_PASSWORD_SUCCESS: {
    ec: 1006,
    msg: 'verify password reset successful'
  },
  RESET_PASSWORDS_SUCCESS: {
    ec: 2007,
    msg: 'reset password successful'
  },
  OAUTH_ERROR: {
    ec: 1004
  },
  USER_UNAUTHENTICATED: {
    ec: 1005
  },
  USER_UPDATE_AVATAR_SUCCESS: {
    ec: 1006
  },
  USER_UPDATE_COVER_IMAGE_SUCCESS: {
    ec: 1007
  },
  USER_INCORECT_PASSWORD: {
    ec: 1009,
    msg: 'Incorrect password'
  },

  FRIEND_REQUEST_DUPLICATE: {
    ec: 2000
  },
  FRIEND_REQUEST_SUCCESS: {
    ec: 2001
  },
  FRIEND_REQUEST_NOT_FOUND: {
    ec: 2002
  },

  FRIEND_REQUEST_DELETE_SUCCESS: {
    ec: 2003
  },
  FRIEND_REQUEST_ACCEPT_SUCCESS: { ec: 2004 },
  FILE_NOT_PROVIDED: {
    ec: 3000
  }
}
