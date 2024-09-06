interface Window {
  umami: Umami;
}

interface Umami {
  /**
   * Tracks a custom single event
   * @param {string} event - The event name
   * @param {Record<string, any>[]} data - The events data
   * @returns {void}
   */
  track: (event: string, data: Record<string, unknown>) => void;
  /**
   * Add information to the current session
   * @param {Record<string, any>[]} data - The session data
   * @returns {void}
   */
  identify: (data: Record<string, unknown>) => void;
}
