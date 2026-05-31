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
    
    def get_directories(self):
        return [x[0].split("/")[1] for x in os.walk("projects/")]
    
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
        self.project_select()
        self.root.mainloop()
        
    def project_select(self):
        self.clear_root()
        button = tk.Button(text="New",command=self.new_project)
        button.pack()
        button = tk.Button(text="Open",command=self.select_project)
        button.pack()

    def new_project(self):
        self.clear_root()
        input = tk.Entry()
        input.pack()
        button = tk.Button(text="Create",command=lambda: self.create_new_project(input.get()))
        button.pack()
        button = tk.Button(text="Cancel",command=self.project_select)
        button.pack()
    
    def create_new_project(self,directory):
        fs.create_new_project(directory)
        self.open_project(directory)

    def select_project(self):
        self.clear_root()
        for directory in fs.get_directories():
            if directory == "":
                continue
            button = tk.Button(text=directory,command=lambda: self.open_project(directory))
            button.pack()
        print("select project")

    def open_project(self,directory):
        self.clear_root()
        fs.set_directory(directory)
        print(directory)
        print("open project")
        game = Game(directory)


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


class Tile:
    def __init__(self):
        print("init tile")

class Screen:
    def __init__(self,xsize,ysize):
        print("init level")
        self.xsize = xsize
        self.ysize = ysize
        self.tiles = []
        for x in range(0,xsize):
            self.tiles.append([])
            for y in range(0,ysize):
                self.tiles[x].append(Tile())
    
                
class Game:
    def __init__(self,directory):
        print("init game")
        self.name = directory
        self.screens = [Screen(10,10)]
        print(self.screens[0].tiles)

fs = FileSystem()
ui = UI()