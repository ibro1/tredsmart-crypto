import { type VariantProps } from "class-variance-authority"

import { IconSet } from "~/components/libs/icon-set"
import { Theme, useTheme } from "~/components/shared/theme"
import { type buttonVariants } from "~/components/ui/button"
import { ButtonIcon } from "~/components/ui/button-icon"

interface ThemeButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export function ThemeButton({ ...props }: ThemeButtonProps) {
  const [theme, setTheme] = useTheme()
  const nameTo = theme === Theme.DARK ? Theme.LIGHT : Theme.DARK

  function handleChangeTheme() {
    setTheme(nameTo)
  }

  return (
    <ButtonIcon
      variant="ghost"
      onClick={handleChangeTheme}
      aria-label="Toggle theme"
      {...props}
    >
      <IconSet.Sun
        weight="duotone"
        className="rotate-0 scale-100 transition-transform dark:-rotate-180 dark:scale-0"
      />
      <IconSet.Moon
        weight="duotone"
        className="absolute rotate-180 scale-0 transition-transform dark:rotate-0 dark:scale-100"
      />
      <span className="sr-only">Toggle theme mode</span>
    </ButtonIcon>
  )
}
