import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

/**
 * A person's photo, or their initial on the app gradient when there is no
 * photo or it fails to load — the same look as the Profile header.
 *
 * Replaces a bare <img src={photo}>, which rendered the browser's broken-image
 * icon with the name spilling over it whenever someone had no photo, and a
 * fallback that sent the person's name to ui-avatars.com.
 */
export default function UserAvatar({
  src,
  name,
  className,
  style,
}: {
  src?: string | null;
  name?: string | null;
  className?: string;
  style?: React.CSSProperties;
}) {
  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?';
  return (
    <Avatar className={cn('size-full', className)} style={style}>
      {src ? <AvatarImage src={src} alt={name ?? ''} className="object-cover" /> : null}
      <AvatarFallback
        className="text-white font-semibold"
        style={{ background: 'linear-gradient(135deg, #BB83C9 0%, #7DE0B3 100%)', fontFamily: "'Outfit', system-ui, sans-serif" }}
      >
        {initial}
      </AvatarFallback>
    </Avatar>
  );
}
