// Minimum lead time before a lesson can be booked.
// Single source of truth: used by the booking UI to hide imminent slots and
// passed to the create_booking_atomic RPC so the DB rejects anything under this.
export const MIN_LEAD_MINUTES = 5;
