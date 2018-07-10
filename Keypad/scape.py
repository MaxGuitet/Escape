import time
from tkinter import *
from tkinter.font import Font
import RPi.GPIO as GPIO

verifCode = "4321"
enterCode = "Entrez le code d'activation manuelle"
codeOK = "Code correct\nDémarrage du protocole d'exfiltration"
codeIncorrect = "Code incorrect\nRéessayez"

buttonPIN = 36
redLED = 38
greenLED = 40

class Application():
    def __init__(self):
        self.tk = Tk()
        myFont = Font(family="Courier new", size=25)
        background = "#111"
        foreground = "#0D5"

        self.fullScreen = False

        # Configuring board inputs/outputs
        GPIO.setup(redLED, GPIO.OUT)
        GPIO.setup(greenLED, GPIO.OUT)

        # Configuring window
        self.tk.attributes("-zoomed", True)
        self.tk["background"] = background

        # Configuring label
        self.label = Label(
            self.tk,
            text=enterCode,
            background=background,
            foreground=foreground,
            font=myFont)
        self.label.pack()

        # Configuring text input
        self.codeString = StringVar()

        self.frames = [None] * 4
        self.inputs = [None] * 4
        for i in range(4):
            self.frames[i] = Frame(self.tk, bd=1, background=foreground)
            self.frames[i].pack()
            self.inputs[i] = Label(
                self.frames[i],
                text="*",
                font=myFont,
                borderwidth=2,
                background=background,
                foreground=foreground)
            self.inputs[i].pack()

        self.tk.update_idletasks()

        # Position elements on screen
        self.label.place(x = self.tk.winfo_width() / 2 - self.label.winfo_width() / 2,
                         y = self.tk.winfo_height() / 2 - self.label.winfo_height() * 2)

        for i in range(4):
            self.frames[i].place(x = self.tk.winfo_width() / 2 + self.frames[i].winfo_width() * (-3.5 + i * 2),
                                 y = self.tk.winfo_height() / 2)

        # Bind events
        self.tk.bind("<F11>", self.toggle_fullscreen)
        self.tk.bind("<Escape>", self.end_fullscreen)
        self.codeString.trace("w", lambda name, index, mode, sv=self.codeString: self.onCodeChange())

        self.setInitialState()

    def setInitialState(self):
        self.codeOK = False
        self.codeString.set('')
        for i in range(4):
            self.inputs[i]["text"] = '*'
        self.tk.update_idletasks()
        self.label["text"] = enterCode
        self.center_horizontal(self.label)
        self.setRedLed(1)
        self.setGreenLed(0)


    def toggle_fullscreen(self, event=None):
        self.fullScreen = not self.fullScreen
        self.tk.attributes("-fullscreen", self.fullScreen)
        return "break"

    def end_fullscreen(self, event=None):
        self.fullScreen = False
        self.tk.attributes("-fullscreen", False)
        return "break"

    def setRedLed(self, state):
        if state != 0 and state != 1:
            state = 0
        GPIO.output(redLED, state)


    def setGreenLed(self, state):
        if state != 0 and state != 1:
            state = 0
        GPIO.output(greenLED, state)

    def center_horizontal(self, widget):
        self.tk.update_idletasks()
        widget.place(x = self.tk.winfo_width() / 2 - widget.winfo_width() / 2)
        self.tk.update_idletasks()
        return "break"

    def onKeyInput(self, char):
        code = self.codeString.get()
        code += str(char)
        self.codeString.set(code)
        if len(code) == 4:
            if code == verifCode:
                self.label["text"] = codeOK
                self.center_horizontal(self.label)
                self.codeOK = True
                self.setRedLed(0)
                self.setGreenLed(1)
            else:
                self.label["text"] = codeIncorrect
                self.center_horizontal(self.label)

                time.sleep(3)

                self.label["text"] = enterCode
                self.center_horizontal(self.label)
                self.codeString.set("")
                for i in range(4):
                    self.inputs[i]["text"] = '*'

    def onCodeChange(self):
        code = self.codeString.get()
        for i in range(len(code)):
            self.inputs[i]["text"] = self.codeString.get()[i]


    def onReset(self):
        if self.codeOK == True:
            self.setInitialState()

class Board():
    def __init__(self, window=None):
        self.window = window

        self.MATRIX = [ [1,2,3,'A'],
                        [4,5,6,'B'],
                        [7,8,9,'C'],
                        ['*',0,'#','D']]

        self.ROW = [7,11,13,15]
        self.COL = [12,16,18,22]

        for j in range(4):
            GPIO.setup(self.COL[j], GPIO.OUT)
            GPIO.output(self.COL[j], 1)

        for i in range(4):
            GPIO.setup(self.ROW[i], GPIO.IN, pull_up_down = GPIO.PUD_UP)

        GPIO.setup(buttonPIN, GPIO.IN, pull_up_down = GPIO.PUD_DOWN)

    def checkInput(self, callback):
        # loop over outputs, set it to low, check for inputs status and reset to high
        for j in range(4):
            GPIO.output(self.COL[j], 0)

            # loop over inputs to check if one has input low (i.e. pressed)
            for i in range(4):
                if GPIO.input(self.ROW[i]) == 0:
                    callback(self.MATRIX[i][j])

                    # stops further execution to avoid printing multiple times
                    while(GPIO.input(self.ROW[i]) == 0):
                        pass

            GPIO.output(self.COL[j], 1)

    def checkButtonPress(self, callback):
        if GPIO.input(buttonPIN) == 1 and window.codeOK == True:
            callback()
            time.sleep(1)

# Main
GPIO.setmode(GPIO.BOARD)
window = Application()
board = Board()


try:
    # Continuously check for input
    while(True):
        window.tk.update_idletasks()
        window.tk.update()
        board.checkInput(window.onKeyInput)
        board.checkButtonPress(window.onReset)

except Exception:
    GPIO.cleanup()
