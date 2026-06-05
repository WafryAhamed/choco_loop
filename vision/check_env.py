import sys
import pkgutil
import importlib

print('sys.executable=', sys.executable)
print('python_version=', sys.version.replace('\n',' '))
print('pkgutil.__file__=', getattr(pkgutil, '__file__', None))
print('pkgutil_has_get_loader=', hasattr(pkgutil, 'get_loader'))
try:
    import flask
    print('flask_version=', flask.__version__)
except Exception as e:
    print('flask import error:', type(e).__name__, e)
try:
    import werkzeug
    print('werkzeug_version=', werkzeug.__version__)
except Exception as e:
    print('werkzeug import error:', type(e).__name__, e)

import pprint
pprint.pprint(sys.path)
