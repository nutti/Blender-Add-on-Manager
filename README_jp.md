# Blenderアドオンマネージャ

GitHubで公開されているアドオンを管理するためのツールです。
本ツールを利用することで、GitHubで公開されている全てのアドオンについて管理することができます。


## ダウンロードURL

|バージョン|URL|
|---|---|
|1.1|[Download](https://github.com/nutti/Blender-Add-on-Manager/releases/tag/v1.1)|
|1.0|[Download](https://github.com/nutti/Blender-Add-on-Manager/releases/tag/v1.0)|
|0.3|[Download](https://github.com/nutti/Blender-Add-on-Manager/releases/tag/v0.3)|
|0.2|[Download](https://github.com/nutti/Blender-Add-on-Manager/releases/tag/v0.2)|
|0.1|[Download](https://github.com/nutti/Blender-Add-on-Manager/releases/tag/v0.1)|


## 対応言語

現在、本アプリケーションでサポートしている言語は以下の通りです。
サポートしたい言語がありましたら、翻訳内容を送ってください。

* 英語（デフォルト）
* スペイン語
  * 提供者：@Oxer


## 提供機能

本ツールは以下の機能を提供します。

* GitHub上で公開されている約2000個のBlenderアドオンの検索
* アドオンの管理
  * GitHub上で公開されているアドオンのインストール
  * インストール済みのアドオンのアンインストール（サポートレベルがExternalのアドオンのみ）
  * GitHub上で公開されているアドオンのアップデート
  * お気に入り
* 異なるバージョンのBlender間でのアドオン移行


## 使い方

[Wiki](https://github.com/nutti/Blender-Add-on-Manager-for-GitHub/wiki/Tutorial_JP)をご覧ください。


## 関連リンク

Blenderアドオンマネージャは現在進行中のプロジェクトです。
より詳細な情報については、以下のリンク先を参照してください。

* [Blender Artist Thread](https://blenderartists.org/forum/showthread.php?418833-Blender-Add-on-Manager-(About-2-000-add-ons-are-available))


## 更新履歴

|バージョン|リリース日|更新内容|
|---|---|---|
|1.1|2017.XX.X|[1] 新機能追加<br> - お気に入り<br> - 異なるバージョン間でのアドオン移行<br>[2] 言語サポート<br> - スペイン語<br>[3] スクロールバー追加<br>[4] データベースのAPIを更新 (サーバ)<br>[5] データベースからのアドオン削除アルゴリズム改良 (サーバ)|
|1.0|2017.11.9|[1] 新機能追加<br> - カスタムディレクトリ上に配置されたアドオンの管理<br> - アドオンのブロック<br>[2] アドオンの表示順序選択<br>[3] リンク切れのアドオン削除 (サーバ)<br>[4] バグ修正<br> - パスに "." を含むアドオン情報の取得に失敗|
|0.3|2017.4.11|[1] configファイルとデータベースファイルをユーザのホームディレクトリに配置<br>[2] サーバサイドプログラムの安定性向上<br>[3] エラー時にポップアップ表示<br>[4] バグ修正<br> - 開発元が未確認のためにmacOSでアプリを起動できない<br> - 本アプリでインストールしたアドオンをBlenderで開けない|
|0.2|2017.4.2|[1] macOSサポート<br>[2] 新機能追加<br> - アドオンのリポジトリへのリンクジャンプ<br>[3] 大文字/小文字を判別しない検索<br>[4] バグ修正<br> - ```__init__.py``` がディレクトリ直下に置かれていた場合にインストールできない|
|0.1|2017.3.25|テスト向けリリース|


## 不具合報告、機能追加依頼

本ツールの不具合報告や機能追加依頼を行い方は **Issue** からお願いします。

https://github.com/nutti/Blender-Add-on-Manager-for-GitHub/issues

## 開発

本ツールの開発に対する修正などを行いたい方は **develop** ブランチへPull Requestすることで修正依頼を行ってください。
**master** ブランチへのPull Requestは禁止します。

https://github.com/nutti/Blender-Add-on-Manager/tree/develop


### テスト

テストはアプリケーションのみ対応しています。

#### アプリケーション

アプリケーションをビルド＆テストするためには、以下の手順に従います。

```sh
 $ git clone https://github.com/nutti/Blender-Add-on-Manager.git
 $ cd Blender-Add-on-Manager
 $ npm install
 $ bower install
 $ gulp
 $ gulp start
```

### リリース

#### アプリケーション

アプリケーションのリリース版は、以下の手順で作成します。

```sh
 $ git clone https://github.com/nutti/Blender-Add-on-Manager.git
 $ cd Blender-Add-on-Manager
 $ npm install
 $ bower install
 $ gulp

 $ npm run build     # Windows/Linux向け

or

 $ node build_mac.js     # MacOS向け
```

#### サーバ

サーバサイドプログラムのリリース版のビルドと、各種サーバの立ち上げは以下の手順で行います（Linux上でのみ動作可能です）。


```sh
 $ git clone https://github.com/nutti/Blender-Add-on-Manager.git
 $ cd Blender-Add-on-Manager
 $ vim src/lib/js/blam-constants.js
# クライアントの定数定義 "USER_DIR" をコメント
# サーバの定数定義 "USER_DIR" のコメントを外す

 $ npm install
 $ npm install electron@1.7.9
 $ bower install
 $ gulp

# GitHubにログインするための設定ファイルを作成
 $ vim config.json
# {
#     "github": {
#          "username": <username>,
#          "password": <password>
#     }
# }

# Pythonの依存するパッケージをインストール
 $ mkdir venv
 $ virtualenv venv
 $ source venv/bin/activate
 $ pip install -r requirements.txt

# APIサーバを立ち上げ
 $ cd src/server
 $ sh run.sh
# GitHubからのアドオン情報収集デーモンを立ち上げ
 $ cd ../..
 $ cd build/server/js
 $ forever start bladdon_collector.js
# アドオンデータベースクリーナの立ち上げ (任意)
 $ node bladdon_cleaner.js
```

## ライセンス

本ツールは **MIT** ライセンスが適用されています。
