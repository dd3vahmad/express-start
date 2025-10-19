tag:
	@if [ -z "$(version)" ]; then \
		echo "version not specified. Use make tag version=x.x.x"
	fi
	git tag v$(version)
	git push origin v$(version)
