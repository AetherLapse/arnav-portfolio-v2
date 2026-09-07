export default function PageLink({ href, navigate, children, ...props }) {
  return (
    <a
      {...props}
      href={href}
      onClick={event => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        navigate(href);
      }}
    >
      {children}
    </a>
  );
}
