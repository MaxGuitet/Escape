from subprocess import call
import sys,tty,termios

class _Getch:
    def __call__(self):
            fd = sys.stdin.fileno()
            old_settings = termios.tcgetattr(fd)
            try:
                tty.setraw(sys.stdin.fileno())
                ch = sys.stdin.read(1)
            finally:
                termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)
            return ch

def main():
    # Set keyboard in QWERTY
    call(["setxkbmap", "gb"])
    code = ''

    while(True):
        inkey = _Getch()
        k = inkey()
        if ord(k) == 27:
            quit()
        elif k != '':
            code += k

        if len(code) == 13:
            print 'code' , code
            code = ''

if __name__=='__main__':
    main()
