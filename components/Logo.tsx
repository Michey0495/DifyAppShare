'use client'

interface LogoProps {
  className?: string
  size?: number
}

export function Logo({ className = '', size = 28 }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="1"
          y="1"
          width="30"
          height="30"
          rx="8"
          fill="url(#logo-bg)"
        />
        {/* 左の縦ライン */}
        <rect x="9" y="9" width="2.5" height="14" rx="1.25" fill="white" />
        {/* 右の半円アーチ（Dの形） */}
        <path
          d="M11.5 9H16C19.866 9 23 12.134 23 16C23 19.866 19.866 23 16 23H11.5"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* 中心のノードドット */}
        <circle cx="17" cy="16" r="2" fill="white" fillOpacity="0.7" />
        <defs>
          <linearGradient
            id="logo-bg"
            x1="1"
            y1="1"
            x2="31"
            y2="31"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#4F46E5" />
            <stop offset="1" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
      </svg>
      <span className="text-lg font-semibold tracking-tight text-slate-900">
        Dify
        <span className="text-indigo-600">App</span>
        Share
      </span>
    </div>
  )
}
