export function IconButton({onClick,label,children,style,ariaPressed,disabled,type='button'}){
  return<button type={type} onClick={onClick} aria-label={label} aria-pressed={ariaPressed} title={label} disabled={disabled}
    style={{background:'transparent',border:'none',cursor:disabled?'default':'pointer',color:'var(--t3)',padding:0,lineHeight:1,...style}}>{children}</button>;
}
