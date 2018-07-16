from RPLCD import CharLCD
from subprocess import call
from time import sleep
import RPi.GPIO as GPIO
import sys, tty, termios

#:qtcl not found\r = Match not found
#'     ERREUR' needed to get it centered

GPIO.setmode(GPIO.BOARD)

class Getch:        
    def __call__(self):
        fd = sys.stdin.fileno()
        old_settings = termios.tcgetattr(fd)
        try:
            tty.setraw(sys.stdin.fileno())
            ch = sys.stdin.read(1)
        finally:
            termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)
        return ch

def close(channel):
    print('call shutdown')
    #call(['shutdown', 'now'])
    
def main():
    lcd = CharLCD(
        numbering_mode=GPIO.BOARD,
        cols=16,
        rows=2,
        pin_rs=37,
        pin_e=35,
        pins_data=[33, 31, 29, 23]
    )
    lcd.clear()
    lcd.cursor_pos = (0, 0)
    lcd.write_string(u'Scannez un tube')
    code = ''
    GPIO.setup(3, GPIO.IN)
    GPIO.add_event_detect(3, GPIO.BOTH, callback=close)
    
    while (True):
        inkey = Getch()
        k = inkey()
        
        if ord(k) == 27:
            GPIO.cleanup()
            call(['shutdown', 'now'])
            #quit()
        elif k == '\r':
            lcd.clear()
            lcd.cursor_pos = (0, 0)
            lcd.write_string(code)
            sleep(5)
            code = ''
            lcd.cursor_pos = (0, 0)
            lcd.write_string(u'Scannez un tube')
            
        elif k != '':
            code += k
        

if __name__ == '__main__':
    main()
