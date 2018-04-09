import time
from tkinter import *
from tkinter.font import Font

class Application():
  def __init__(self, master=None):
    self.tk = Tk()

    myFont = Font(family="Courier new", size=22)
    background = '#111'
    foreground = '#0D5'

    self.verifCode = '4321'

    self.tk.attributes('-zoomed', True)
    self.tk['background'] = background

    # Configuring label
    self.label = Label(self.tk, text="Enter manual activation code", background=background, foreground=foreground)
    self.label.configure(font=myFont)
    self.label.pack()

    # Configuring text input
    self.codeString = StringVar()
    self.input = Entry(self.tk, font=myFont, justify="center", textvariable=self.codeString)
    self.input.pack()

    self.tk.update_idletasks()

    # Position Label on screen
    self.label.place(x = self.tk.winfo_width() / 2 - self.label.winfo_width() / 2,
      y = self.tk.winfo_height() / 2 - self.label.winfo_height() * 2)

    self.input.place(x = self.tk.winfo_width() / 2 - self.input.winfo_width() / 2,
      y = self.tk.winfo_height() / 2)

    self.input.bind('<KeyRelease>', self.onKeyInput)
    self.input.focus()

    self.state = False
    self.tk.bind("<F11>", self.toggle_fullscreen)
    self.tk.bind("<Escape>", self.end_fullscreen)

  def toggle_fullscreen(self, event=None):
    self.state = not self.state
    self.tk.attributes('-fullscreen', self.state)
    return "break"

  def end_fullscreen(self, event=None):
    self.state = False
    self.tk.attributes('-fullscreen', False)
    return "break"

  def center_horizontal(self, widget):
    self.tk.update_idletasks()
    widget.place(x = self.tk.winfo_width() / 2 - widget.winfo_width() / 2)
    self.tk.update_idletasks()
    return "break"

  def onKeyInput(self, event):
    code = self.codeString.get()
    if len(code) == 4:
      if code == self.verifCode:
        self.input.destroy()
        self.label['text'] = "Activation code correct\nStarting exfiltration protocol"
        self.center_horizontal(self.label)
      else:
        self.label['text'] = "Invalid code entered\nTry again"
        self.input.config(state="disabled")
        self.center_horizontal(self.label)
        time.sleep(3)
        self.label['text'] = "Enter manual activation code"
        self.input.config(state="normal")
        self.center_horizontal(self.label)
        self.codeString.set('')

w = Application()
w.tk.mainloop()
