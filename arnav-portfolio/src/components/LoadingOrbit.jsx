import './LoadingOrbit.css';

export default function LoadingOrbit({ className = '' }) {
  return <div className={`loading-orbit ${className}`} aria-hidden="true"><i /><i /><i /></div>;
}
