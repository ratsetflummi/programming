for i in range(10):
	text = []
	for j in range(10):
		if i==j:
			text.append("-") 
		else:
			text.append("*")
	print("".join(text))