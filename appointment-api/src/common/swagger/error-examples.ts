export const errorExamples = {
  validationError: {
    summary: 'VALIDATION_ERROR',
    value: {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'customerEmail must be a valid email address.',
      },
    },
  },
  slotNotFound: {
    summary: 'SLOT_NOT_FOUND',
    value: {
      error: {
        code: 'SLOT_NOT_FOUND',
        message: 'No slot exists with this id.',
      },
    },
  },
  slotUnavailable: {
    summary: 'SLOT_UNAVAILABLE',
    value: {
      error: {
        code: 'SLOT_UNAVAILABLE',
        message: 'This slot already has an active booking.',
      },
    },
  },
  bookingNotFound: {
    summary: 'BOOKING_NOT_FOUND',
    value: {
      error: {
        code: 'BOOKING_NOT_FOUND',
        message: 'No booking exists with this id.',
      },
    },
  },
  internalError: {
    summary: 'INTERNAL_ERROR',
    value: {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred.',
      },
    },
  },
} as const;
