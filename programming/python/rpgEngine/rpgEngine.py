import os
import tkinter as tk


class FileSystem():
    def __init__(self):
        self.project_directory = ""

    def set_directory(self,directory):
        self.project_directory = directory

    def check_new_directory(self):
        return True
    
    def get_directory(self):
        return self.project_directory
    
    def create_new_project(self,directory):
        if directory == "":
            ui.error("Enter a name.")
            return
        self.set_directory("projects/"+directory)
        try:
            os.makedirs(self.get_directory())
        except:
            ui.error("A project with that name exists already.")

class UI:
    def __init__(self):
        self.root = tk.Tk()
        self.error_label = tk.Label(master=self.root,fg="red")
        self.root.geometry('600x400+250+150')
        
    def project_select(self):
        button = tk.Button(text="New",command=self.new_project)
        button.pack()
        button = tk.Button(text="Open",command=self.open_project)
        button.pack()
        self.root.mainloop()

    def new_project(self):
        self.clear_root()
        input = tk.Entry()
        input.pack()
        button = tk.Button(text="Create",command=lambda: fs.create_new_project(input.get()))
        button.pack()

    def open_project(self):
        self.clear_root()
        print("open project")

    def clear_root(self):
        self.clear_all_inside_frame(self.root)

    def clear_all_inside_frame(self,frame):
        for widget in frame.winfo_children():
            widget.destroy()

    def error(self,text):
        if self.error_label:
            self.error_label.destroy()
        self.error_label = tk.Label(master=self.root,fg="red",text=text)
        self.error_label.pack()

ui = UI()
fs = FileSystem()
ui.project_select()