export function EnvironmentalArtwork() {
  return (
    <div
      className="pu-visual"
      aria-label="Representação de uma rede de sensores ambientais conectados pelo território"
      role="img"
    >
      <div className="pu-visual-top" aria-hidden="true">
        <span>01 / TERRITÓRIO</span>
        <span className="pu-visual-signal">
          <i /> REDE CONECTADA
        </span>
      </div>

      <svg
        viewBox="0 0 560 340"
        className="pu-visual-svg"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id="pu-route" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#22b8b5" />
            <stop offset=".58" stopColor="#00a6e6" />
            <stop offset="1" stopColor="#8cdd2d" />
          </linearGradient>

          <radialGradient id="pu-core">
            <stop stopColor="#104e6d" />
            <stop offset="1" stopColor="#10253c" />
          </radialGradient>

          <filter
            id="pu-soft-glow"
            x="-100%"
            y="-100%"
            width="300%"
            height="300%"
          >
            <feGaussianBlur stdDeviation="10" />
          </filter>
        </defs>

        <g
          className="pu-contours"
          fill="none"
          stroke="#72b8cf"
          strokeWidth="1"
        >
          <path d="M-50 107C33 5 123 18 172 45c64 36 108-63 211-46 98 16 92 108 215 52" />
          <path d="M-43 139C42 38 110 45 167 74c81 42 119-50 207-42 100 9 124 103 223 57" />
          <path d="M-36 174C61 71 118 86 168 106c75 30 139-33 208-34 97-2 126 88 218 59" />
          <path d="M-36 217C52 119 124 117 173 135c74 27 125-18 200-24 101-8 132 64 217 56" />
          <path d="M-42 275C58 169 118 153 175 165c74 16 131-16 207-14 90 2 140 57 211 59" />
          <path d="M-30 322C74 218 130 184 189 190c68 7 113-2 177-2 107 0 159 58 223 64" />
          <path d="M39 362c80-94 133-135 208-138 82-3 101 5 158 5 101 0 145 47 192 76" />
        </g>

        <path
          className="pu-route-glow"
          d="M112 226Q178 134 281 169Q363 112 440 95M281 169Q362 204 446 244"
          fill="none"
          stroke="url(#pu-route)"
          strokeWidth="12"
          filter="url(#pu-soft-glow)"
          opacity=".6"
        />

        <path
          className="pu-route-line"
          d="M112 226Q178 134 281 169Q363 112 440 95M281 169Q362 204 446 244"
          fill="none"
          stroke="url(#pu-route)"
          strokeWidth="2"
        />

        <g className="pu-node pu-node-one">
          <circle cx="112" cy="226" r="25" fill="#22b8b5" opacity=".08" />
          <circle
            className="pu-node-ring"
            cx="112"
            cy="226"
            r="15"
            fill="none"
            stroke="#22b8b5"
          />
          <circle cx="112" cy="226" r="5" fill="#22b8b5" />
        </g>

        <g className="pu-node pu-node-two">
          <circle cx="440" cy="95" r="25" fill="#00a6e6" opacity=".08" />
          <circle
            className="pu-node-ring"
            cx="440"
            cy="95"
            r="15"
            fill="none"
            stroke="#00a6e6"
          />
          <circle cx="440" cy="95" r="5" fill="#00a6e6" />
        </g>

        <g className="pu-node pu-node-three">
          <circle cx="446" cy="244" r="25" fill="#8cdd2d" opacity=".08" />
          <circle
            className="pu-node-ring"
            cx="446"
            cy="244"
            r="15"
            fill="none"
            stroke="#8cdd2d"
          />
          <circle cx="446" cy="244" r="5" fill="#8cdd2d" />
        </g>

        <g className="pu-center">
          <circle
            cx="281"
            cy="169"
            r="93"
            fill="#00a6e6"
            opacity=".08"
            filter="url(#pu-soft-glow)"
          />
          <circle
            cx="281"
            cy="169"
            r="87"
            fill="none"
            stroke="#4da5c3"
            strokeOpacity=".15"
            strokeDasharray="2 10"
          />
          <circle
            cx="281"
            cy="169"
            r="68"
            fill="none"
            stroke="#3e91b0"
            strokeOpacity=".32"
          />
          <circle
            cx="281"
            cy="169"
            r="52"
            fill="url(#pu-core)"
            stroke="#62bfd4"
            strokeWidth="1.5"
          />
          <path
            d="M247 169h17l9-17 13 35 11-18h18"
            fill="none"
            stroke="url(#pu-route)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx="281"
            cy="169"
            r="37"
            fill="none"
            stroke="#8bd6df"
            strokeOpacity=".18"
          />
        </g>

        <g
          className="pu-label"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="1.5"
          fill="#e4f7ff"
        >
          <rect
            x="47"
            y="262"
            width="86"
            height="28"
            rx="8"
            fill="#15334a"
            stroke="#366b7d"
          />
          <text x="63" y="281">AR</text>

          <rect
            x="442"
            y="41"
            width="88"
            height="28"
            rx="8"
            fill="#15334a"
            stroke="#366b7d"
          />
          <text x="454" y="60">CLIMA</text>

          <rect
            x="419"
            y="273"
            width="98"
            height="28"
            rx="8"
            fill="#15334a"
            stroke="#517b62"
          />
          <text x="432" y="292">LEITURAS</text>
        </g>
      </svg>

      <div className="pu-visual-bottom" aria-hidden="true">
        <span>
          AR <b /> CLIMA <b /> TERRITÓRIO
        </span>
        <span>MONITORAMENTO AMBIENTAL</span>
      </div>
    </div>
  )
}
