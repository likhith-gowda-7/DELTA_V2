// Centralized WebRTC configuration: STUN + (optional) TURN servers.
//
// By default the app uses only Google STUN servers, which works for most
// home networks but FAILS on symmetric NAT, corporate firewalls, and most
// mobile carriers. To enable TURN, set the following env vars in
// `frontend/.env` (Vite exposes only VITE_-prefixed vars to the client):
//
//   VITE_TURN_URL=turn:turn.example.com:3478
//   VITE_TURN_USERNAME=your-turn-username
//   VITE_TURN_CREDENTIAL=your-turn-credential
//
// Recommended providers: Twilio Network Traversal Service, Metered.ca,
// Cloudflare Calls, or a self-hosted coturn instance.
//
// Production notes:
// - TURN credentials are short-lived; rotate via REST API for production.
// - Multiple TURN servers can be added; the first reachable is used.
// - Never embed long-lived TURN credentials in a public client bundle.

const turnUrl = import.meta.env.VITE_TURN_URL;
const turnUsername = import.meta.env.VITE_TURN_USERNAME;
const turnCredential = import.meta.env.VITE_TURN_CREDENTIAL;

const buildIceServers = () => {
  const servers = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ];

  if (turnUrl && turnUsername && turnCredential) {
    servers.push({
      urls: turnUrl,
      username: turnUsername,
      credential: turnCredential,
    });
  }

  return servers;
};

export const ICE_SERVERS = buildIceServers();

/** WebRTC peer-connection defaults. */
export const RTC_CONFIG = {
  iceServers: ICE_SERVERS,
  iceCandidatePoolSize: 10,
};

/** Group-call runtime caps. */
export const GROUP_CALL_LIMITS = {
  /** Hard cap enforced at runtime. Schema allows 2-100, but mesh
   *  topology collapses past ~6-8 participants (CPU + bandwidth). */
  MAX_PARTICIPANTS: 6,
  /** Auto-reject incoming call after this many seconds. */
  INCOMING_TIMEOUT_MS: 30_000,
  /** How often to emit connection-quality stats (ms). */
  QUALITY_REPORT_INTERVAL_MS: 5_000,
};

export const IS_TURN_CONFIGURED = Boolean(
  turnUrl && turnUsername && turnCredential,
);
