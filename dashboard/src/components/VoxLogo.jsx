export default function VoxLogo({ height = 32 }) {
    return (
      <img
        src="/logo.svg"
        alt="Voxtrend"
        style={{ height, width: 'auto', display: 'block' }}
      />
    )
  }