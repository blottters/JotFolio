export function Pressable({onPress,ariaLabel,ariaPressed,children,style,className,title}){
  return<div role="button" tabIndex={0} aria-label={ariaLabel} aria-pressed={ariaPressed} title={title||ariaLabel} onClick={onPress}
    onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onPress?.(e)}}} style={style} className={className}>{children}</div>;
}
