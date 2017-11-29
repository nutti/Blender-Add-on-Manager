from flask import Flask, jsonify
from flask_restful import Resource, Api, abort
import json
import pymongo
from bson import ObjectId
from bson import Binary, Code
from bson.json_util import loads, dumps

app = Flask(__name__)
api = Api(app)


class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        return json.JSONEncoder.default(self, o)


class LegacyAddonList(Resource):
    def get(self, service):
        SERVICES = ["github"]
        if not service in SERVICES:
            abort(404, message="Service {0} is not supported".format(service))

        db = BlAddonDB(service)
        db.connect()
        data = []
        for d in db.get_all():
            en = JSONEncoder().encode(d)
            de = json.JSONDecoder().decode(en)
            data.append(de)
        db.close()

        data = self.__format(data)

        return jsonify(data)

    def __format(self, raw):
        return raw


class LegacyAddonTotal(Resource):
    def get(self):
        SERVICES = ["github"]

        data = {};
        for service in SERVICES:
            db = BlAddonDB(service)
            db.connect()
            count = 0;
            for d in db.get_all():
                count = count + 1
            data[service] = count

        return jsonify(data)


class LegacyVersion(Resource):
    def get(self):
        return jsonify({"version": "0.1.2"})


class LegacyServices(Resource):
    def get(self):
        return jsonify(SERVICES)


api.add_resource(LegacyServices, "/api/bl-addon-db/services")
api.add_resource(LegacyVersion, "/api/bl-addon-db/version")
api.add_resource(LegacyAddonList, "/api/bl-addon-db/addon-list/<service>")
api.add_resource(LegacyAddonTotal, "/api/bl-addon-db/addon-total")


def available_versions():
    return ["1.0.0", "0.1.2"]


def available_services(version):
    return ["github"]


def check_version(version):
    return version in available_versions()


def check_service(version, service):
    return service in available_services(version)


class Versions(Resource):
    def get(self):
        return jsonify({"version": available_versions()})


class AddonList(Resource):
    def get(self, version, service):
        ok = check_version(version)
        if not ok:
            abort(404, message="API version {0} does not exist".format(version))

        ok = check_service(version, service)
        if not ok:
            abort(404, message="Service {0} is not supported in API version {1}".format(service, version))

        db = BlAddonDB(service)
        db.connect()
        data = []
        for d in db.get_all():
            en = JSONEncoder().encode(d)
            de = json.JSONDecoder().decode(en)
            data.append(de)
        db.close()

        data = self.__format(data)

        return jsonify(data)

    def __format(self, raw):
        return raw


class AddonTotal(Resource):
    def get(self, version):
        ok = check_version(version)
        if not ok:
            abort(404, message="API version {0} does not exist".format(version))

        data = {};
        for service in available_services(version):
            db = BlAddonDB(service)
            db.connect()
            count = 0;
            for d in db.get_all():
                count = count + 1
            data[service] = count
        return jsonify(data)


class Services(Resource):
    def get(self, version):
        ok = check_version(version)
        if not ok:
            abort(404, message="API version {0} does not exist".format(version))

        return jsonify({"service": available_services(version)})


api.add_resource(Versions, "/api/bl-addon-db/versions")
api.add_resource(Services, "/api/bl-addon-db/v<version>/services")
api.add_resource(AddonList, "/api/bl-addon-db/v<version>/addon-list/<service>")
api.add_resource(AddonTotal, "/api/bl-addon-db/v<version>/addon-total")


class BlAddonDB():

    def __init__(self, service):
        self.__client = None
        self.__db = None
        self.__collection = None
        self.__service = service

    def connect(self):
        self.__client = pymongo.MongoClient("localhost", 27017)
        if self.__service == "github":
            self.__db = self.__client.blAddonMgr
            self.__collection = self.__db.blAddonGitHub

    def find_one(self, key):
        return self.__collection.find_one(key)

    def find(self, key):
        return self.__collection.find(key)

    def get_all(self):
        return self.__collection.find()

    def close(self):
        self.__client.close()


if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True)
