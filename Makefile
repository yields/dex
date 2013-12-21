
C8= node_modules/.bin/component
BROWSERS= 'ie10..11, chrome'
GRAVY= node_modules/.bin/gravy
URL= http://localhost:3000/test
SRC= $(wildcard lib/*.js)

build: node_modules components $(SRC)
	@$(C8) build --dev

components: component.json
	@$(C8) install --dev

clean:
	rm -fr build components template.js node_modules
	@$(MAKE) kill

node_modules: package.json
	@npm install

test/pid: node_modules
	@node_modules/.bin/serve -L . 2>&1 & \
	echo $$! > test/pid
	@sleep 1

server: test/pid

test: build server
	@open $(URL)

test-sauce: build server
	@BROWSERS=$(BROWSERS) $(GRAVY) --url $(URL)
	@$(MAKE) kill

kill:
	@kill `cat test/pid`
	@rm -f test/pid

.PHONY: clean test test-sauce
