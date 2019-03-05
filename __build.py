import os
from datetime import datetime, timezone

class ProcDefaultDict(dict):
	def __init__(self, def_factory, *args, **kwargs):
		super().__init__(*args, **kwargs)
		self.def_factory = def_factory
	
	def __getitem__(self, key):
		try:
			return super().__getitem__(key)
		except KeyError:
			return self.def_factory(key)

with open("fragments/_template.html", encoding="utf-8") as template_file:
	template = template_file.read()

gen_timestamp = datetime.now(tz=timezone.utc).timestamp()
print(gen_timestamp)

for i_file in os.listdir("fragments"):
	if i_file.endswith(".html") and not i_file.endswith("_template.html"):
		folder_name = i_file[:-5]
		if folder_name == "index":
			folder_name = ""
		print("/" + folder_name)
		
		i_file = os.path.join("fragments", i_file)
		
		with open(i_file, encoding="utf-8") as fragment_file:
			fragment = fragment_file.read()
		
		o_file = os.path.join(folder_name, "index.html")
		if folder_name:
			os.makedirs(folder_name, exist_ok=True)
		
		side_links = ProcDefaultDict('href="{}"'.format, {
			"/" + folder_name: 'href="/{}" class="current"'.format(folder_name)
		})
		
		with open(o_file, "w", encoding="utf-8") as whole_file:
			whole_file.write(template.format(
				page_fragment=fragment,
				side_link=side_links,
				gen_timestamp=gen_timestamp))