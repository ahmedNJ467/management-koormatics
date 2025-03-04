
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="bg-green-50 dark:bg-green-900/20">
            <CardTitle className="flex items-center text-green-700 dark:text-green-400">
              <Package className="mr-2 h-5 w-5" />
              In Stock
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold">{inStockParts.length}</div>
            <p className="text-sm text-muted-foreground">Available parts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-yellow-50 dark:bg-yellow-900/20">
            <CardTitle className="flex items-center text-yellow-700 dark:text-yellow-400">
              <Tag className="mr-2 h-5 w-5" />
              Low Stock
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold">{lowStockParts.length}</div>
            <p className="text-sm text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-red-50 dark:bg-red-900/20">
            <CardTitle className="flex items-center text-red-700 dark:text-red-400">
              <HardDrive className="mr-2 h-5 w-5" />
              Out of Stock
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold">{outOfStockParts.length}</div>
            <p className="text-sm text-muted-foreground">Need reordering</p>
          </CardContent>
        </Card>
      </div>
