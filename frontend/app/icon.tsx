/** @format */

import {ImageResponse} from "next/og"

export const size = {
  width: 512,
  height: 512
}
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        background: "#09090b",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "110px",
        border: "8px solid #27272a"
      }}>
      <svg
        width='280'
        height='280'
        viewBox='0 0 24 24'
        fill='none'
        stroke='url(#grad)'
        strokeWidth='1.8'
        strokeLinecap='round'
        strokeLinejoin='round'>
        <defs>
          <linearGradient id='grad' x1='0%' y1='0%' x2='100%' y2='100%'>
            <stop offset='0%' stopColor='#3b82f6' />
            <stop offset='100%' stopColor='#06b6d4' />
          </linearGradient>
        </defs>
        <rect width='20' height='14' x='2' y='7' rx='2' ry='2' />
        <path d='M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16' />
      </svg>
    </div>,
    {
      ...size
    }
  )
}
